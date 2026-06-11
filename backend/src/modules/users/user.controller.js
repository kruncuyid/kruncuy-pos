const userService = require("./user.service");

exports.getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers(req.query);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.body, req.user);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body, req.user);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
