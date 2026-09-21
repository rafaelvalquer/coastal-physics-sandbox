export class ConstructionPreview {
  constructor(validator) {
    this.validator = validator;
  }

  inspect(type, position, length = 10) {
    const validation = this.validator.validate(type, position, length);
    return {
      ...validation,
      color: validation.valid
        ? validation.risk === "HIGH"
          ? "yellow"
          : "green"
        : "red"
    };
  }
}
