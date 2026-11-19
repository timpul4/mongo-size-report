const TOP_DBS = 5, TOP_COLLS = 10;
const GB = 1024 ** 3;
const n = v => (v == null ? 0 : typeof v.toNumber === "function" ? v.toNumber() : Number(v));
const gb = b => (n(b) / GB).toFixed(2);

const dbs = db.adminCommand({ listDatabases: 1 }).databases
  .map(d => ({ name: d.name, size: n(d.sizeOnDisk) }))
  .sort((a, b) => b.size - a.size)
  .slice(0, TOP_DBS);

print(`\n=== Топ ${TOP_DBS} баз (GB на диске) ===`);
console.table(dbs.map(d => ({ db: d.name, size_gb: gb(d.size) })));

dbs.forEach(d => {
  const sdb = db.getSiblingDB(d.name);
  const rows = sdb.getCollectionInfos({ type: "collection" }).map(c => {
    try {
      const s = sdb.runCommand({ collStats: c.name });
      return { collection: c.name, size: n(s.storageSize) + n(s.totalIndexSize), docs: n(s.count) };
    } catch (e) { return null; }
  }).filter(Boolean)
    .sort((a, b) => b.size - a.size)
    .slice(0, TOP_COLLS)
    .map(r => ({ collection: r.collection, size_gb: gb(r.size), docs: r.docs }));

  print(`\n=== ${d.name} (${gb(d.size)} GB) ===`);
  console.table(rows);
});