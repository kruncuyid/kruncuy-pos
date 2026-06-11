const authService = require("./auth.service");
const env = require("../../core/config/env");

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    // Set refresh token as httpOnly cookie
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
    });

    // Remove refresh token from JSON response (keep it secure)
    const { refreshToken, ...safeResult } = result;

    res.json({
      success: true,
      message: "Login berhasil",
      data: safeResult,
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    const result = await authService.refresh(refreshToken);

    // Rotate refresh token
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { token: result.token },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.clearCookie("refresh_token", { path: "/api/auth" });
    res.json({ success: true, message: "Logout berhasil" });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const result = await authService.me(req.user);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
