const FormDraft = require("../models/form.model");

/**
 * Save (or update) a form draft for a given email.
 * Called when the user moves between steps so progress isn't lost.
 */
async function saveFormDraft(email, currentStep, stepData, uploadedFiles) {
  const draft = await FormDraft.findOneAndUpdate(
    { email },
    {
      currentStep,
      stepData,
      uploadedFiles,
      // Reset expiry on every save
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return draft;
}

/**
 * Load an existing form draft by email.
 * Returns null if no draft exists.
 */
async function getFormDraft(email) {
  return FormDraft.findOne({ email });
}

/**
 * Delete a draft after successful final submission.
 */
async function deleteFormDraft(email) {
  return FormDraft.deleteOne({ email });
}

module.exports = { saveFormDraft, getFormDraft, deleteFormDraft };