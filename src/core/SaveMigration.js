export class SaveMigration {
  static CURRENT_VERSION = 1;

  static migrate(save) {
    if (!save) throw new Error("Save inválido");
    const version = Number(save.saveVersion || 1);
    if (version > SaveMigration.CURRENT_VERSION) {
      throw new Error("Save criado por uma versão mais nova do jogo");
    }
    return { ...save, saveVersion: SaveMigration.CURRENT_VERSION };
  }
}
