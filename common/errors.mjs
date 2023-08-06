export class NoInputFileError extends Error {
  constructor() {
    super("No input file specified");
  }
}
