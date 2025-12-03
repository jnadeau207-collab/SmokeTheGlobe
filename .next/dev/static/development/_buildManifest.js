self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/admin": [
    "static/chunks/pages/admin.js"
  ],
  "__rewrites": {
    "afterFiles": [],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/admin",
    "/admin/batches",
    "/admin/batches/[id]",
    "/admin/brands",
    "/admin/dispensaries",
    "/admin/lab-results",
    "/admin/labs",
    "/admin/licenses",
    "/admin/locations",
    "/admin/recalls",
    "/admin/states",
    "/admin/states/[stateCode]",
    "/admin/uploads",
    "/admin/uploads/[id]",
    "/api/admin/batches",
    "/api/admin/batches/[id]",
    "/api/admin/brands",
    "/api/admin/dispensaries",
    "/api/admin/ingest",
    "/api/admin/lab-results/[id]",
    "/api/admin/licenses/import",
    "/api/admin/register-upload",
    "/api/admin/state-summary",
    "/api/admin/states/[code].ts",
    "/api/admin/states/[stateCode]",
    "/api/admin/uploads",
    "/api/admin/uploads/[id]",
    "/api/algolia/reindex",
    "/api/auth/[...nextauth]",
    "/api/uploads-presign",
    "/auth/signin"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()