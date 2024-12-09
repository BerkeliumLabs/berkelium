export class DataFrame {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private data: Record<string, any>[];

  /**
   * Initializes a new instance of the DataFrame class with the provided data.
   *
   * @param {Record<string, any[]>[]} data - An array of records where each record
   * contains a string key and an array of any type values, representing the data
   * to be stored in the DataFrame.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: Record<string, any[]>[]) {
    this.data = data;
  }

  /**
   * Gets the column names of the DataFrame.
   *
   * @returns {string[]} - An array of strings containing the column names of the DataFrame.
   */
  get columns(): string[] {
    return this.data.length > 0 ? Object.keys(this.data[0]) : [];
  }

  /**
   * Gets the index labels of the DataFrame.
   *
   * @returns {number[]} - An array of numbers representing the index labels of the DataFrame.
   * Each index represents the position of the row in the data.
   */
  get index(): number[] {
    return Array.from({ length: this.data.length }, (_, i) => i);
  }
}
