import express from "express";

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand
} = require("@aws-sdk/client-s3");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: "private.assets.art-flex.co",
      Key: "gary.jpeg"
    });
    const url = await getSignedUrl(req.app.locals.s3_client, command, {
      expiresIn: 3600
    });
    res.send({ url });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

const createUpload = async (req, res) => {
  try {
    const uploadId = req.headers["x-upload-id"];
    const totalChunks = parseInt(req.headers["x-total-chunks"], 10);

    if (uploadId in req.app.locals.uploadTable) {
      res
        .status(500)
        .send({ statusMessage: "AWS multiupload currently in progress." });
    }

    req.app.locals.uploadTable[uploadId] = {
      chunksProcessed: 0,
      totalChunks,
      chunks: {},
      awsUploadId: null
    };

    const createMultipartUpload = new CreateMultipartUploadCommand({
      Bucket: "private.assets.art-flex.co",
      ContentType: "application/octet-stream",
      Key: uploadId
    });
    const { UploadId: awsUploadId } = await req.app.locals.s3_client.send(
      createMultipartUpload
    );
    req.app.locals.uploadTable[uploadId].awsUploadId = awsUploadId;
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};
const uploadPart = async (req, res, next) => {
  try {
    const uploadId = req.headers["x-upload-id"];
    const totalChunks = parseInt(req.headers["x-total-chunks"], 10);
    const currentChunkNumber = parseInt(
      req.headers["x-current-chunk-number"],
      10
    );

    if (
      !("awsUploadId" in req.app.locals.uploadTable[uploadId]) ||
      req.app.locals.uploadTable[uploadId].awsUploadId === null
    ) {
      res.sendStatus(500);
    }
    const uploadPartCommand = new UploadPartCommand({
      Bucket: "private.assets.art-flex.co",
      UploadId: req.app.locals.uploadTable[uploadId].awsUploadId,
      Key: uploadId,
      PartNumber: currentChunkNumber,
      Body: req.body
    });
    const { ETag } = await req.app.locals.s3_client.send(uploadPartCommand);

    req.app.locals.uploadTable[uploadId].chunksProcessed += 1;
    req.app.locals.uploadTable[uploadId].chunks[currentChunkNumber] = ETag;

    if (req.app.locals.uploadTable[uploadId].chunksProcessed === totalChunks) {
      next();
    } else {
      res.sendStatus(206);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};
const completeUpload = async (req, res) => {
  try {
    const uploadId = req.headers["x-upload-id"];
    const completeMultipartUpload = new CompleteMultipartUploadCommand({
      Bucket: "private.assets.art-flex.co",
      Key: uploadId,
      UploadId: req.app.locals.uploadTable[uploadId].awsUploadId,
      MultipartUpload: {
        Parts: Object.keys(req.app.locals.uploadTable[uploadId].chunks).map(
          key => ({
            PartNumber: parseInt(key, 10),
            ETag: req.app.locals.uploadTable[uploadId].chunks[key]
          })
        )
      }
    });
    await req.app.locals.s3_client.send(completeMultipartUpload);
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
};

router.post("/createUpload", createUpload);

router.post(
  "/uploadPart",
  express.raw({ limit: "20mb" }),
  uploadPart,
  completeUpload
);

// router.post("/studio/sell_item", async (req, res) => {});

export default router;
