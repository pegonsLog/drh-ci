const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const axios = require("axios");
const cors = require("cors")({origin: true});
const {google} = require("googleapis");
const {Readable} = require("stream");

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

// --- Função para Upload no Google Drive ---
exports.uploadPdfToDrive = onRequest({secrets: [notionApiKey]}, (req, res) => {
  cors(req, res, async () => {
    try {
      const {fileContent, fileName} = req.body;
      if (!fileContent || !fileName) {
        return res.status(400).send("Conteúdo do arquivo e nome são obrigatórios.");
      }

      // 1. Autenticação com a Conta de Serviço
      const auth = new google.auth.GoogleAuth({
        // As credenciais são carregadas automaticamente pelo ambiente do Google Cloud
        // quando a função é implantada. Para teste local, você precisará configurar
        // o arquivo de chave JSON da sua conta de serviço.
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      const drive = google.drive({version: "v3", auth});

      // 2. Preparar o arquivo para upload
      const buffer = Buffer.from(fileContent, "base64");
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      // ID da pasta no Google Drive para onde os arquivos serão enviados.
      // **IMPORTANTE**: Substitua pelo ID da sua pasta de destino.
      const folderId = "1zdGIE10Bu9k3Uozt5uMRGpEytsVjFMtZ"; // ID da pasta de destino

      // 3. Fazer o upload do arquivo
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType: "application/pdf",
        body: stream,
      };

      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id, webViewLink", // Solicita o link de visualização
      });

      // 4. (Opcional) Tornar o arquivo público para leitura
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      // 5. Retornar o link do arquivo
      res.status(200).send({webViewLink: file.data.webViewLink});
    } catch (error) {
      console.error("Erro ao fazer upload para o Google Drive:", error);
      res.status(500).send("Falha no upload para o Google Drive.");
    }
  });
});
