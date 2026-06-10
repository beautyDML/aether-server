
import { Readable } from "stream";
import { drive } from "../config/googleDrive.config.js";
import { ApiError } from "../utils/ApiError.js";

const FOLDER_ID = process.env.GOOGLE_FOLDER_ID;

// ─── Upload a file buffer to Google Drive ────────────────────────────────────
const uploadFileToDrive = async (
  fileBuffer,
  fileName,
  mimeType,
  subFolder = null,
) => {
  try {
    console.log("MAIN FOLDER ID:", FOLDER_ID);
console.log("SUBFOLDER:", subFolder);
console.log("Uploading started...");
console.log("Folder ID:", FOLDER_ID);
    let targetFolderId = FOLDER_ID;
    if (subFolder) {
      targetFolderId = await getOrCreateSubFolder(subFolder, FOLDER_ID);
    }

    // Buffer → Readable stream (Drive API needs a stream, not a buffer)
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: `${Date.now()}_${fileName}`,
        parents: [targetFolderId],
      },
      media: {
        mimeType,
        body: bufferStream,
      },
      fields: "id, name, webViewLink, webContentLink",
    });

    // Make publicly viewable so <img src="directUrl"> works on the frontend
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const fileId = response.data.id;

    return {
      fileId,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      directUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    };
  } catch (error) {
    console.error("FULL GOOGLE ERROR:");
console.error(error);
    throw new ApiError(
      500,
      `Failed to upload to Google Drive: ${error.message}`,
    );
  }
};

// ─── Delete a file from Drive by fileId ──────────────────────────────────────
const deleteFileFromDrive = async (fileId) => {
  try {
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error("Drive delete error:", error.message);
    throw new ApiError(500, `Failed to delete from Drive: ${error.message}`);
  }
};

// ─── Get or create a named subfolder inside the main folder ──────────────────
const getOrCreateSubFolder = async (folderName, parentId) => {
  try {
    const res = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: "files(id, name)",
    });

    if (res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id",
    });

    return folder.data.id;
  } catch (error) {
    throw new ApiError(500, `Subfolder error: ${error.message}`);
  }
};

export { uploadFileToDrive, deleteFileFromDrive };
