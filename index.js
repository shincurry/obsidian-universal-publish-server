const express = require('express');
const multer  = require('multer')
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const shell = require('shelljs');
const AdmZip = require("adm-zip");
const cors = require('cors');

const app = express()
const host = process.env.HOST || "127.0.0.1"
const port = process.env.PORT || 9000

const MKDOCS_CONFIG_PATH = process.env.MKDOCS_CONFIG_PATH
const MKDOCS_BASE_DOCS_PATH = process.env.MKDOCS_BASE_DOCS_PATH
const MKDOCS_DIST_PATH = process.env.MKDOCS_DIST_PATH
if (!MKDOCS_CONFIG_PATH) {
  throw new Error("MKDOCS_CONFIG_PATH not set.")
}
if (!MKDOCS_DIST_PATH) {
  throw new Error("MKDOCS_DIST_PATH not set.")
}
if (!fs.lstatSync(MKDOCS_CONFIG_PATH).isFile()) {
  throw new Error("MKDOCS_CONFIG_PATH is not file.")
}
if (MKDOCS_BASE_DOCS_PATH && !fs.lstatSync(MKDOCS_BASE_DOCS_PATH).isDirectory()) {
  throw new Error("MKDOCS_BASE_DOCS_PATH is not directory.")
}
if (!fs.lstatSync(MKDOCS_DIST_PATH).isDirectory()) {
  throw new Error("MKDOCS_DIST_PATH is not directory.")
}

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip') return cb(null, true);
    return cb(null, false);
  },
});

app.use(cors())

app.post('/publish', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('require file')
  }

  const publishId = uuidv4();
  const tmpDir = path.join(__dirname, "./tmp");
  const publishDir = path.join(tmpDir, publishId);
  try {

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    fs.mkdirSync(publishDir);

    if (MKDOCS_CONFIG_PATH) {
      if (fs.lstatSync(MKDOCS_CONFIG_PATH).isFile()) {
        fs.cpSync(MKDOCS_CONFIG_PATH, path.join(publishDir, 'mkdocs.yml'))
      }
    }
    fs.mkdirSync(path.join(publishDir, 'docs'))
    if (MKDOCS_BASE_DOCS_PATH) {
      if (fs.lstatSync(MKDOCS_BASE_DOCS_PATH).isDirectory()) {
        const files = fs.readdirSync(MKDOCS_BASE_DOCS_PATH)
        for (const file of files) {
          fs.cpSync(path.join(MKDOCS_BASE_DOCS_PATH, file), path.join(publishDir, 'docs', file), {
            recursive: true,
          })
        }
      }
    }

    const zip = new AdmZip(req.file.buffer);
    zip.extractAllTo(path.join(publishDir, 'docs'), true);

    const command = `cd ${publishDir} && mkdocs build -d ${MKDOCS_DIST_PATH} -c`;
    shell.exec(command);

    fs.rmSync(publishDir, { recursive: true, force: true });

    return res.status(204).send()
  } catch (error) {
    console.error(error)
    fs.rmSync(publishDir, { recursive: true, force: true });
    return res.status(400).send("failed");
  }
})

app.listen(port, host, () => {
  console.log(`App listening on port ${host}:${port}`)
})