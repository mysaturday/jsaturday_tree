var Tree = require('./index.js');

var t = new Tree({
  TTL: false,
  orphanParentId: 'myOrphanNodes'  // Default is ORPHANS

});

console.log(t)

t.addNode({_id: "NODE", name: "CIAO", _parent:"ROOT"});
t.addNode({_id: "NODE1", name: "CIAO1", _parent: "NODE"});
t.addNode({_id: "NODE2", name: "CIAO1", _parent: "NODE"});
t.addNode({_id: "NODE3", name: "CIAO1", _parent: "NODE1"});
t.addNode({_id: "NODE4", name: "CIAO1"});


console.log(t.getAll());

console.log('---------');

t.removeNode("NODE1");

console.log(t.getAll());

console.log('---------');

var n3a = t.getNodeCopy('NODE3');
console.log(n3a);
n3a.CIAO = 1;
console.log(n3a);
var n3b = t.getNodeCopy('NODE3');
console.log(n3b);

console.log('---------');
t.updateNode(n3a);
n3a.OK = true;
console.log(t.getNodeCopy('NODE3'));