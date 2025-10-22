// pages/api/pcloud/start.js
export default async function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.PCLOUD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.PCLOUD_REDIRECT_URI,
  })
  res.redirect(`https://my.pcloud.com/oauth2/authorize?${params.toString()}`)
}
