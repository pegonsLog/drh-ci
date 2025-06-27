const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const axios = require("axios");
const cors = require("cors")({origin: true});

// Define o segredo que será usado para armazenar a chave da API do Notion.
const notionApiKey = defineSecret("NOTION_API_KEY");

// Cria a função HTTP usando a sintaxe v2, passando os segredos como opção.
exports.notionProxy = onRequest({secrets: [notionApiKey]}, (req, res) => {
  // Habilita o CORS para que a aplicação Angular possa chamar esta função.
  cors(req, res, async () => {
    // O ID do banco de dados e o filtro são passados no corpo da requisição.
    const {databaseId, filter} = req.body;

    if (!databaseId) {
      return res.status(400).send("O ID do banco de dados do Notion é obrigatório.");
    }

    const notionApiUrl = `https://api.notion.com/v1/databases/${databaseId}/query`;

    try {
      const response = await axios.post(notionApiUrl, {filter}, {
        headers: {
          "Authorization": `Bearer ${notionApiKey.value()}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      });

      return res.status(200).send(response.data);
    } catch (error) {
      console.error(
        "Erro ao chamar a API do Notion:",
        error.response ? error.response.data : error.message,
      );
      const status = error.response ? error.response.status : 500;
      return res.status(status).send("Erro ao processar a solicitação para o Notion.");
    }
  });
});
