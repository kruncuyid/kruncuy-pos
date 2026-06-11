const masterDataService = require("./masterData.service");

exports.getReferenceData = async (req, res, next) => {
  try {
    const result = await masterDataService.getReferenceData();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
