import Joi from "joi";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));

      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }

    next();
  };
};

export const schemas = {
  register: Joi.object().unknown(true),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createIdea: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(20).max(2000).required(),
    category: Joi.string()
      .valid(
        "technology",
        "healthcare",
        "finance",
        "education",
        "environment",
        "social",
        "consumer",
        "enterprise"
      )
      .required(),
    stage: Joi.string()
      .valid("idea", "prototype", "mvp", "beta", "launched")
      .required(),
    fundingGoal: Joi.number().min(1000).required(),
    tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
  }),

  addComment: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
  }),

  sendMessage: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
    messageType: Joi.string().valid("text", "file", "image").default("text"),
  }),
};
