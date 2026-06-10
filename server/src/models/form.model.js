import mongoose from "mongoose";

// General contact or inquiry form submissions
const FormSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true },
    formType: {
      type: String,
      enum: ["contact", "inquiry", "support", "other"],
      default: "contact",
    },
    attachments: [
      {
        fileId: String,
        fileName: String,
        webViewLink: String,
        directUrl: String,
        _id: false,
      },
    ],
    status: {
      type: String,
      enum: ["new", "read", "replied", "closed"],
      default: "new",
    },
    ipAddress: String,
  },
  { timestamps: true },
);

const Form = mongoose.model("Form", FormSchema);
export default Form;
