const parallel = require('mocha.parallel');
const assert = require("assert");

const TeemoJS = require("../index");

parallel('CDragon API', function() {
  this.slow(1500);

  const api = TeemoJS(TeemoJS.cdragonConfig);
  const version = 'pbe';
  const locale = 'default';

  it('gets champion-summary.json', async function() {
    const data = await api.req('data.championSummary', { version, locale });
    assert.ok(data);
    const teemo = data.find(({ alias }) => 'Teemo' === alias);
    assert.ok(teemo);
  });
  it('gets champions/17.json (Teemo)', async function() {
    const teemo = await api.req('data.championById', [ version, locale, 17 ]);
    assert.ok(teemo);
    assert.equal(teemo.title, "the Swift Scout");
  });
  it('gets champions/-1.json (None)', async function() {
    const data = await api.req('data.championById', { version, locale, id: -1 });
    assert.ok(data);
    assert.equal(data.name, 'None');
  });
  it('gets maps.json', async function() {
    const data = await api.req('data.maps', [ version, 'ja_jp' ]);
    assert.ok(data);
    const sr = data.find(({ id }) => 11 === id);
    assert.ok(sr);
    assert.equal(sr.name, 'サモナーズリフト');
  });
  it('gets summoner-emotes.json', async function() {
    const data = await api.req('data.summonerEmotes', [ version, 'zh_cn' ]);
    assert.ok(data);
    const teemote = data.find(({ id }) => 3212 === id);
    assert.ok(teemote);
    assert.equal(teemote.name, '提莫表情');
  });
});
