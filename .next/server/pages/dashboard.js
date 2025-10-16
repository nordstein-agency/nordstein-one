"use strict";
(() => {
var exports = {};
exports.id = 26;
exports.ids = [26,888,660];
exports.modules = {

/***/ 176:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  config: () => (/* binding */ config),
  "default": () => (/* binding */ next_route_loaderpage_2Fdashboard_preferredRegion_absolutePagePath_private_next_pages_2Fdashboard_js_absoluteAppPath_next_2Fdist_2Fpages_2F_app_absoluteDocumentPath_next_2Fdist_2Fpages_2F_document_middlewareConfigBase64_e30_3D_),
  getServerSideProps: () => (/* binding */ getServerSideProps),
  getStaticPaths: () => (/* binding */ getStaticPaths),
  getStaticProps: () => (/* binding */ getStaticProps),
  reportWebVitals: () => (/* binding */ reportWebVitals),
  routeModule: () => (/* binding */ routeModule),
  unstable_getServerProps: () => (/* binding */ unstable_getServerProps),
  unstable_getServerSideProps: () => (/* binding */ unstable_getServerSideProps),
  unstable_getStaticParams: () => (/* binding */ unstable_getStaticParams),
  unstable_getStaticPaths: () => (/* binding */ unstable_getStaticPaths),
  unstable_getStaticProps: () => (/* binding */ unstable_getStaticProps)
});

// NAMESPACE OBJECT: ./pages/dashboard.js
var dashboard_namespaceObject = {};
__webpack_require__.r(dashboard_namespaceObject);
__webpack_require__.d(dashboard_namespaceObject, {
  "default": () => (Dashboard)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/pages/module.js
var pages_module = __webpack_require__(185);
var module_default = /*#__PURE__*/__webpack_require__.n(pages_module);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-route-loader/helpers.js
var helpers = __webpack_require__(182);
// EXTERNAL MODULE: ./node_modules/next/dist/pages/_document.js
var _document = __webpack_require__(940);
var _document_default = /*#__PURE__*/__webpack_require__.n(_document);
// EXTERNAL MODULE: ./node_modules/next/dist/pages/_app.js
var _app = __webpack_require__(35);
var _app_default = /*#__PURE__*/__webpack_require__.n(_app);
// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(893);
// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(689);
// EXTERNAL MODULE: ./lib/supabaseClient.js
var supabaseClient = __webpack_require__(126);
;// CONCATENATED MODULE: external "next/router"
const router_namespaceObject = require("next/router");
;// CONCATENATED MODULE: ./pages/dashboard.js




function Dashboard() {
    const [user, setUser] = (0,external_react_.useState)(null);
    const [customers, setCustomers] = (0,external_react_.useState)([]);
    const router = (0,router_namespaceObject.useRouter)();
    (0,external_react_.useEffect)(()=>{
        // Prüfen, ob Benutzer eingeloggt ist
        supabaseClient/* supabase */.O.auth.getSession().then(({ data: { session } })=>{
            if (!session) router.push("/") // nicht eingeloggt → zurück zur Login-Seite
            ;
            else setUser(session.user);
        });
        // Kunden abrufen
        const fetchCustomers = async ()=>{
            const { data } = await supabaseClient/* supabase */.O.from("customers").select("*");
            setCustomers(data);
        };
        fetchCustomers();
    }, []);
    if (!user) return /*#__PURE__*/ jsx_runtime.jsx("p", {
        children: "Loading..."
    });
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
        style: {
            padding: "2rem"
        },
        children: [
            /*#__PURE__*/ jsx_runtime.jsx("h1", {
                children: "Dashboard"
            }),
            /*#__PURE__*/ (0,jsx_runtime.jsxs)("h2", {
                children: [
                    "Willkommen, ",
                    user.email
                ]
            }),
            /*#__PURE__*/ jsx_runtime.jsx("h3", {
                children: "Kundenliste"
            }),
            /*#__PURE__*/ jsx_runtime.jsx("ul", {
                children: customers.map((c)=>/*#__PURE__*/ (0,jsx_runtime.jsxs)("li", {
                        children: [
                            c.name,
                            " (",
                            c.type,
                            ") – ",
                            c.status
                        ]
                    }, c.id))
            })
        ]
    });
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?page=%2Fdashboard&preferredRegion=&absolutePagePath=private-next-pages%2Fdashboard.js&absoluteAppPath=next%2Fdist%2Fpages%2F_app&absoluteDocumentPath=next%2Fdist%2Fpages%2F_document&middlewareConfigBase64=e30%3D!

        // Next.js Route Loader
        
        

        // Import the app and document modules.
        
        

        // Import the userland code.
        

        // Re-export the component (should be the default export).
        /* harmony default export */ const next_route_loaderpage_2Fdashboard_preferredRegion_absolutePagePath_private_next_pages_2Fdashboard_js_absoluteAppPath_next_2Fdist_2Fpages_2F_app_absoluteDocumentPath_next_2Fdist_2Fpages_2F_document_middlewareConfigBase64_e30_3D_ = ((0,helpers/* hoist */.l)(dashboard_namespaceObject, "default"));

        // Re-export methods.
        const getStaticProps = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "getStaticProps")
        const getStaticPaths = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "getStaticPaths")
        const getServerSideProps = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "getServerSideProps")
        const config = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "config")
        const reportWebVitals = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "reportWebVitals")
        

        // Re-export legacy methods.
        const unstable_getStaticProps = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "unstable_getStaticProps")
        const unstable_getStaticPaths = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "unstable_getStaticPaths")
        const unstable_getStaticParams = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "unstable_getStaticParams")
        const unstable_getServerProps = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "unstable_getServerProps")
        const unstable_getServerSideProps = (0,helpers/* hoist */.l)(dashboard_namespaceObject, "unstable_getServerSideProps")

        // Create and export the route module that will be consumed.
        const options = {"definition":{"kind":"PAGES","page":"/dashboard","pathname":"/dashboard","bundlePath":"","filename":""}}
        const routeModule = new (module_default())({
          ...options,
          components: {
            App: (_app_default()),
            Document: (_document_default()),
          },
          userland: dashboard_namespaceObject,
        })
        
        
    

/***/ }),

/***/ 126:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   O: () => (/* binding */ supabase)
/* harmony export */ });
Object(function webpackMissingModule() { var e = new Error("Cannot find module '@supabase/supabase-js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());

// Supabase URL und Public Key aus Vercel Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Supabase Client erzeugen
const supabase = Object(function webpackMissingModule() { var e = new Error("Cannot find module '@supabase/supabase-js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(supabaseUrl, supabaseAnonKey);


/***/ }),

/***/ 76:
/***/ ((module) => {

module.exports = require("next/dist/server/future/route-modules/route-module.js");

/***/ }),

/***/ 140:
/***/ ((module) => {

module.exports = require("next/dist/server/get-page-files.js");

/***/ }),

/***/ 716:
/***/ ((module) => {

module.exports = require("next/dist/server/htmlescape.js");

/***/ }),

/***/ 100:
/***/ ((module) => {

module.exports = require("next/dist/server/render.js");

/***/ }),

/***/ 368:
/***/ ((module) => {

module.exports = require("next/dist/server/utils.js");

/***/ }),

/***/ 724:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/constants.js");

/***/ }),

/***/ 743:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/html-context.js");

/***/ }),

/***/ 524:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/is-plain-object.js");

/***/ }),

/***/ 232:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/utils.js");

/***/ }),

/***/ 689:
/***/ ((module) => {

module.exports = require("react");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [940,35,722,893], () => (__webpack_exec__(176)));
module.exports = __webpack_exports__;

})();