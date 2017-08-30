const RiotApi = require("./index");

let inst = RiotApi('RGAPI-asdf', {});
inst.get('na1', 'championMastery.getAllChampionMasteries', 69009277)
  .then(r => console.log('1'))
  .catch(console.err);
inst.get('na1', 'championMastery.getAllChampionMasteries', 69009277)
  .then(r => console.log('2'))
  .catch(console.err);
inst.get('na1', 'championMastery.getAllChampionMasteries', 69009277)
  .then(r => console.log('3'))
  .catch(console.err);
inst.get('na1', 'championMastery.getAllChampionMasteries', 69009277)
  .then(r => console.log('4'))
  .catch(console.err);
inst.get('na1', 'match.getMatchlist', 229267260, {
  champion: [143, 44],
})
  .then(console.log)
  .catch(console.err);
