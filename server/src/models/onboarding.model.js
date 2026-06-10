import mongoose from "mongoose";

const DriveFileSchema = new mongoose.Schema({
  fileId:       String,
  fileName:     String,
  webViewLink:  String,
  directUrl:    String,
  mimeType:     String,
  uploadedAt:   { type: Date, default: Date.now },
}, { _id: false });

const AddressSchema = new mongoose.Schema({
  street:     String,
  street2:    String,
  city:       String,
  state:      String,
  postalCode: String,
  country:    String,
  timezone:   String,
}, { _id: false });

const OnboardingSchema = new mongoose.Schema({
  // Step 1
  accountType: { type: String, enum: ["individual", "business", "enterprise"] },

  // Step 2
  firstName:    String,
  middleName:   String,
  lastName:     String,
  dateOfBirth:  Date,
  gender:       String,
  nationality:  String,

  // Business / Enterprise
  companyName:     String,
  legalName:       String,
  tradeName:       String,
  regNumber:       String,
  regDate:         Date,
  industry:        String,
  employeeRange:   String,
  subsidiaryCount: Number,
  parentCompany:   String,
  isListed:        Boolean,
  tickerSymbol:    String,

  operatingHours: mongoose.Schema.Types.Mixed,

  // Step 3
  address:        AddressSchema,
  sameAsPrimary:  Boolean,
  mailingAddress: AddressSchema,

  // Step 4
  roles:            [String],
  departments:      [String],
  permissions:      mongoose.Schema.Types.Mixed,
  twoFactorEnabled: Boolean,
  twoFactorMethod:  String,

  // Step 5
  questionnaire: mongoose.Schema.Types.Mixed,
  riskScore:     Number,
  riskLevel:     { type: String, enum: ["low", "medium", "high"] },

  // Step 6
  termsAccepted:   Boolean,
  termsAcceptedAt: Date,
  submittedAt:     Date,
  status: {
    type:    String,
    enum:    ["submitted", "under_review", "approved", "rejected"],
    default: "submitted",
  },

  // Google Drive files
  profileImage: DriveFileSchema,

  idFront: {
    file:   DriveFileSchema,
    status: {
      type:    String,
      enum:    ["pending", "verified", "rejected"],
      default: "pending",
    },
  },

  idBack: {
    file:   DriveFileSchema,
    status: {
      type:    String,
      enum:    ["pending", "verified", "rejected"],
      default: "pending",
    },
  },

  // ✅ FIXED: renamed "type" to "documentType" to avoid Mongoose reserved keyword conflict
  documents: [
    {
      documentType: String,
      file:         DriveFileSchema,
      status: {
        type:    String,
        enum:    ["pending", "verified", "rejected"],
        default: "pending",
      },
    },
  ],

  signature: {
    driveFile: DriveFileSchema,
    signedAt:  Date,
  },

}, { timestamps: true });

export default mongoose.model("Onboarding", OnboardingSchema);
