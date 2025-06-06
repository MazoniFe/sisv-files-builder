const fs = require("fs").promises;
const fss = require("fs");
const puppeteer = require("puppeteer");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");


const { normalizeCepNumber, normalizeCnpjNumber, normalizeCpfNumber, normalizePhoneNumber } = require("./masks");

async function getHeaderScreenshot(data, layout) {
  const headerBuilder = await getHeaderBuilder(layout);
  await headerBuilder.build(data);

  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const headerPage = await browser.newPage();

  await headerPage.setContent(headerBuilder.getContent());
  await headerPage.waitForSelector(".header");

  const headerElement = await headerPage.$(".header");
  if (!headerElement) {
    await browser.close();
    throw new Error("Elemento .header não encontrado");
  }

  const screenshot = await headerElement.screenshot({
    type: 'jpeg',
    encoding: 'base64',
    quality: 100,
  });

  await browser.close();
  return screenshot;
}

async function getHeaderBuilder(layout) {
  let HeaderBuilder;
  if (layout === 'LAYOUT_1') {
    HeaderBuilder = (await import('../../client1/src/components/builders/HeaderBuilder.js')).default;
  } else if (layout === 'LAYOUT_2') {
    HeaderBuilder = (await import('../../client2/src/components/builders/HeaderBuilder.js')).default;
  } else if (layout === 'LAYOUT_3') {
    HeaderBuilder = (await import('../../client3/src/components/builders/HeaderBuilder.js')).default;
  } else {
    throw new Error(`LAYOUT inválido: ${layout}`);
  }

  return new HeaderBuilder();
}

async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log("Arquivo removido com sucesso!");
  } catch (err) {
    console.error("Erro ao remover o arquivo:", err);
  }
}

async function deleteFolder(folderPath) {
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    console.log("Pasta removida com sucesso!");
  } catch (err) {
    console.error("Erro ao remover a pasta:", err);
  }
}

async function saveJsonToFile(jsonData, filePath) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true }); // Garante que o diretório existe
    const jsonString = JSON.stringify(jsonData, null, 2);
    await fs.writeFile(filePath, jsonString);
    console.log("Arquivo salvo com sucesso!");
  } catch (err) {
    console.error("Erro ao salvar o arquivo:", err);
  }
}

function findPropertyJson(obj, path) {
  const keys = path.split("-");

  let current = obj;
  for (let key of keys) {
    let match = key.match(/(\w+)\[(\d+)\]/);

    if (match) {
      let prop = match[1];
      let index = parseInt(match[2], 10);
      if (!Array.isArray(current[prop]) || current[prop].length <= index) {
        return undefined;
      }
      current = current[prop][index];
    } else {
      if (current[key] === undefined) {
        return undefined;
      }
      current = current[key];
    }
  }
  return current;
}

function customColorsStyleTag(data) {
  const { customizationConfig, approvalStatus } = data;

  const { primaryColor, secondColor } = customizationConfig;
  const { color } = approvalStatus;

  return `
    .primary-bg-color {
      background-color: ${primaryColor};
    }
    .secondary-bg-color {
      background-color: ${secondColor};
    }
    .approval-status-bg-color {
      background-color: ${color};
    }
    .primary-border-color {
      border-color: ${primaryColor};
    }
    .t-bg-green100 {
      background-color: #dcfce7;
    }
    .t-text-green700 {
      color: #008236;
    }
    .t-bg-red100 {
      background-color: #ffe2e2;
    }
    .t-text-red700 {
      color: #c10007;
    }
    .t-text-red600 {
      color: #e7000b;
    }
    .t-text-blue600 {
     color: #155dfc
    }
    .text-transparent {
     color: transparent
    }
  `;
}

function getClientName(client) {
  if (!client) return "Particular";
  const firstName = client.firstName || "";
  const lastName = client.lastName || "";
  return `${firstName} ${lastName}`.trim() || "Particular";
}

function createChunks(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Função para buscar um valor aninhado dentro de um objeto a partir de uma string de caminho.
 * Exemplo: getNestedValue(obj, "inspectionVehicleData.data.licensePlate")
 */
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ""), obj);
}

function setGroupOrder(id, group, $) {
  $(`#${id}`)
    .removeClass((i, className) => (className.match(/order-\d+/g) || []).join(" "))
    .removeClass("hidden")
    .addClass(`order-${group.printOrder}`);
}

function createTempDir() {
  const TEMP_DIR = path.join(__dirname, "temp");

  if (!fss.existsSync(TEMP_DIR)) {
    fss.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return TEMP_DIR;
}

function getFormattedField(type, value) {
  const availableTypes = {
    CEP: normalizeCepNumber(value),
    CNPJ: normalizeCnpjNumber(value),
    CPF: normalizeCpfNumber(value),
    PHONE: normalizePhoneNumber(value),
  };
  return availableTypes[type] || value;
}

function formatValue(value) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(value);
}

async function compressPDFWithGhostscript(originalPdfBuffer) {
  const tempDir = os.tmpdir();
  const originalPath = path.join(tempDir, `original_${Date.now()}.pdf`);
  const compressedPath = path.join(tempDir, `compressed_${Date.now()}.pdf`);

  try {
    await fs.writeFile(originalPath, originalPdfBuffer);

    await new Promise((resolve, reject) => {
      const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/printer -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${compressedPath}" "${originalPath}"`;
      exec(command, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const compressedBuffer = await fs.readFile(compressedPath);
    return compressedBuffer;
  } finally {
    // Cleanup arquivos temporários
    fs.unlink(originalPath).catch(() => {});
    fs.unlink(compressedPath).catch(() => {});
  }
}

module.exports = {
  deleteFile,
  deleteFolder,
  saveJsonToFile,
  getHeaderScreenshot,
  findPropertyJson,
  customColorsStyleTag,
  getClientName,
  createChunks,
  getNestedValue,
  setGroupOrder,
  createTempDir,
  getFormattedField,
  formatValue,
  compressPDFWithGhostscript
};
