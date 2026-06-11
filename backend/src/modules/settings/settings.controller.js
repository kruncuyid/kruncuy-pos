const settingsService = require("./settings.service");

exports.getOverview = async (req, res, next) => {
  try {
    const result = await settingsService.getSettingsOverview();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.upsertSystemSetting = async (req, res, next) => {
  try {
    const result = await settingsService.upsertSystemSetting(req.params.key, req.body || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.upsertFeatureFlag = async (req, res, next) => {
  try {
    const result = await settingsService.upsertFeatureFlag(req.params.key, req.body || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
