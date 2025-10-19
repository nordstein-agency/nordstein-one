// pages/api/stats.js
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId fehlt' })

  try {
    // 1️⃣ Alle Mitarbeiter (direkt + indirekt) ermitteln
    const allUsers = new Set([userId])
    let queue = [userId]

    while (queue.length > 0) {
      const current = queue.pop()
      const { data: subs, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('leader', current)

      if (error) throw error

      subs?.forEach(sub => {
        if (!allUsers.has(sub.id)) {
          allUsers.add(sub.id)
          queue.push(sub.id)
        }
      })
    }

    const allUserIds = Array.from(allUsers)

    // 2️⃣ Zeitrahmen für aktuelles Quartal berechnen
    const now = new Date()
    const currentQuarter = Math.floor(now.getMonth() / 3)
    const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1)
    const endOfQuarter = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0, 23, 59, 59)

    // 3️⃣ Historische Eigenproduktion
    const { data: ownContracts, error: ownError } = await supabase
      .from('contracts')
      .select('eh')
      .eq('created_by', userId)
      .not('eh', 'is', null)
    if (ownError) throw ownError
    const ownTotal = ownContracts.reduce((sum, c) => sum + (c.eh || 0), 0)

    // 4️⃣ Historische Gesamtproduktion (Team)
    const { data: teamContracts, error: teamError } = await supabase
      .from('contracts')
      .select('eh, created_by')
      .in('created_by', allUserIds)
      .not('eh', 'is', null)
    if (teamError) throw teamError
    const teamTotal = teamContracts.reduce((sum, c) => sum + (c.eh || 0), 0)

    // 5️⃣ Quartalsproduktion (Eigen & Team)
    const { data: quarterContracts, error: quarterError } = await supabase
      .from('contracts')
      .select('eh, created_by, sent_at')
      .in('created_by', allUserIds)
      .gte('sent_at', startOfQuarter.toISOString())
      .lte('sent_at', endOfQuarter.toISOString())
      .not('eh', 'is', null)
    if (quarterError) throw quarterError

    const ownQuarter = quarterContracts
      .filter(c => c.created_by === userId)
      .reduce((sum, c) => sum + (c.eh || 0), 0)
    const teamQuarter = quarterContracts.reduce((sum, c) => sum + (c.eh || 0), 0)

    // 6️⃣ Ergebnis zurückgeben
    return res.status(200).json({
      success: true,
      data: {
        ownTotal,
        teamTotal,
        ownQuarter,
        teamQuarter
      }
    })
  } catch (err) {
    console.error('stats route error:', err)
    return res.status(500).json({ error: err.message })
  }
}
