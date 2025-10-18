import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userModel.js";

export const getFullReferralNetwork = catchAsyncError(async (req, res, next) => {
  const buildTree = async (userId) => {
    const children = await User.find({ referredBy: userId }).select("full_name email refralCode");
    const result = [];

    for (const child of children) {
      const node = {
        user: {
          _id: child._id,
          full_name: child.full_name,
          email: child.email,
          refralCode: child.refralCode
        },
        children: await buildTree(child._id)
      };
      result.push(node);
    }

    return result;
  };

  // Find all root-level users (not referred by anyone)
  const rootUsers = await User.find({ referredBy: null }).select("full_name email refralCode");

  const network = [];

  for (const root of rootUsers) {
    network.push({
      user: {
        _id: root._id,
        full_name: root.full_name,
        email: root.email,
        refralCode: root.refralCode
      },
      children: await buildTree(root._id)
    });
  }

  res.status(200).json({
    success: true,
    network,
  });
});
