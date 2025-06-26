import * as functions from "firebase-functions";
import axios from "axios";

// Define a chave da API do Notion e a URL base.
// A chave da API será buscada das variáveis de ambiente do Firebase para segurança.
const NOTION_API_KEY = functions.config().notion.key;
const NOTION_API_BASE_URL = "https://api.notion.com";

export const api = functions.https.onRequest(async (request, response) => {
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
    const notionResponse = await axios({
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
  } catch (error: any) {
    console.error("Erro ao chamar a API do Notion:", error.message);
    if (error.response) {
      response.status(error.response.status).send(error.response.data);
    } else {
      response.status(500).send("Erro interno no proxy da API.");
    }
  }
});
