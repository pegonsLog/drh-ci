"use strict";
const __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    let desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = {enumerable: true, get: function() {
 return m[k];
}};
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
const __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", {enumerable: true, value: v});
}) : function(o, v) {
    o["default"] = v;
});
const __importStar = (this && this.__importStar) || (function() {
    let ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o) {
            const ar = [];
            for (const k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function(mod) {
        if (mod && mod.__esModule) return mod;
        const result = {};
        if (mod != null) for (let k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
const __importDefault = (this && this.__importDefault) || function(mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const axios_1 = __importDefault(require("axios"));
// Define a chave da API do Notion e a URL base.
// A chave da API será buscada das variáveis de ambiente do Firebase para segurança.
const NOTION_API_KEY = functions.config().notion.key;
const NOTION_API_BASE_URL = "https://api.notion.com";
exports.api = functions.https.onRequest(async (request, response) => {
    // Permite requisições do seu domínio de produção para evitar erros de CORS.
    response.set("Access-Control-Allow-Origin", "https://drh-ci.web.app");
    response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // O navegador envia uma requisição "preflight" (OPTIONS) antes de POST/GET.
    // Respondemos a ela para que a requisição principal seja permitida.
    if (request.method === "OPTIONS") {
        response.status(204).send("");
        return;
    }
    // Monta a URL final da API do Notion, removendo o prefixo "/api" da URL original.
    const notionUrl = `${NOTION_API_BASE_URL}${request.originalUrl.replace("/api", "")}`;
    try {
        // Faz a chamada para a API do Notion usando axios.
        const notionResponse = await (0, axios_1.default)({
            method: request.method,
            url: notionUrl,
            data: request.body,
            headers: {
                "Authorization": `Bearer ${NOTION_API_KEY}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28", // Versão da API do Notion.
            },
        });
        // Retorna a resposta do Notion para o cliente (seu app Angular).
        response.status(notionResponse.status).send(notionResponse.data);
    } catch (error) {
        console.error("Erro ao chamar a API do Notion:", error.message);
        if (error.response) {
            response.status(error.response.status).send(error.response.data);
        } else {
            response.status(500).send("Erro interno no proxy da API.");
        }
    }
});
// # sourceMappingURL=index.js.map
