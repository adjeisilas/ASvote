import app from "../server/app";

console.log("Vercel API function initialized");

export default (req: any, res: any) => {
  try {
    console.log(`API request received: ${req.method} ${req.url}`);
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Function Error:", err);
    res.status(500).json({
      error: "Vercel function crash",
      message: err.message,
      stack: err.stack
    });
  }
};
