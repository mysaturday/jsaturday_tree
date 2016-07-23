var mocha = require('mocha');
var should = require('should');

var Tree = require('../index.js');

var data = [{
  _id: "NODE.1",
  _parent: "ROOT",
  value: "1"
}, {
  _id: "NODE.2",
  _parent: "ROOT",
  value: "2"
}, {
  _id: "NODE.1.1",
  _parent: "NODE.1",
  value: "3"
}, {
  _id: "NODE.1.2",
  _parent: "NODE.1",
  value: "4"
}, {
  _id: "NODE.2.1",
  _parent: "NODE.2",
  value: "5"
}, {
  _id: "NODE.2.2",
  _parent: "NODE.2",
  value: "6"
}, {
  _id: "NODE.3",
  value: "7"
}];

var tree1;

describe('# jSaturday_tree', function() {

  it('# Create a new Object', function(done) {
    var tree2 = new Tree();
    done();
  });

  it('# Create a new Object with params', function(done) {
    tree1 = new Tree({
      TTL: 0,
      orphanParentId: "MY_ORPHANS"
    });
    done();
  });

  it('# Addings nodes to tree', function(done) {
    for (var i = 0; i < data.length; i++)
      tree1.addNode(data[i]);
    done();
  });

  it('# Checking if all node are present', function(done) {
    var s = tree1.getAllCopy();

    s.should.have.property('ROOT');
    s.should.have.property('MY_ORPHANS');
    s.should.have.property('NODE.1');
    s.should.have.property('NODE.1.1');
    s.should.have.property('NODE.1.2');
    s.should.have.property('NODE.2');
    s.should.have.property('NODE.2.1');
    s.should.have.property('NODE.2.2');
    s.should.have.property('NODE.3');

    done();
  });

  it('# Checking ROOT', function(done) {
    var node = tree1.getAllCopy().ROOT;
    checkNode(node, {
      _id: 'ROOT',
      _children: ['NODE.1', 'NODE.2', 'MY_ORPHANS'],
      noParent: true
    });

    done();
  });

  it('# Checking MY_ORPHANS', function(done) {
    var node = tree1.getAllCopy().MY_ORPHANS;
    checkNode(node, {
      _id: 'MY_ORPHANS',
      _children: ['NODE.3'],
      _parent: 'ROOT'
    });

    done();
  });

  it('# Checking NODE.1', function(done) {
    var node = tree1.getAllCopy()['NODE.1'];
    checkNode(node, {
      _id: 'NODE.1',
      _children: ['NODE.1.1', 'NODE.1.2'],
      _parent: 'ROOT'
    });

    done();
  });

  it('# Checking NODE.1.1', function(done) {
    var node = tree1.getAllCopy()['NODE.1.1'];
    checkNode(node, {
      _id: 'NODE.1.1',
      noChildren: true,
      _parent: 'NODE.1'
    });

    done();
  });

  it('# Checking NODE.1.2', function(done) {
    var node = tree1.getAllCopy()['NODE.1.2'];
    checkNode(node, {
      _id: 'NODE.1.2',
      noChildren: true,
      _parent: 'NODE.1'
    });

    done();
  });

  it('# Checking NODE.2', function(done) {
    var node = tree1.getAllCopy()['NODE.2'];
    checkNode(node, {
      _id: 'NODE.2',
      _children: ['NODE.2.1', 'NODE.2.2'],
      _parent: 'ROOT'
    });

    done();
  });

  it('# Checking NODE.2.1', function(done) {
    var node = tree1.getAllCopy()['NODE.2.1'];
    checkNode(node, {
      _id: 'NODE.2.1',
      noChildren: true,
      _parent: 'NODE.2'
    });

    done();
  });

  it('# Checking NODE.2.2', function(done) {
    var node = tree1.getAllCopy()['NODE.2.2'];
    checkNode(node, {
      _id: 'NODE.2.2',
      noChildren: true,
      _parent: 'NODE.2'
    });

    done();
  });

  it('# Checking NODE.3', function(done) {
    var node = tree1.getAllCopy()['NODE.3'];
    checkNode(node, {
      _id: 'NODE.3',
      noChildren: true,
      _parent: 'MY_ORPHANS'
    });

    done();
  });

  it('# Checking default ORPHAN node', function(done) {
    var tree3 = new Tree();
    tree3.addNode({
      _id: "TEST"
    });

    var s = tree3.getAllCopy();

    s.should.have.property('ROOT');
    s.should.have.property('ORPHANS');
    s.should.have.property('TEST');

    checkNode(s['TEST'], {
      _id: 'TEST',
      noChildren: true,
      _parent: 'ORPHANS'
    });

    checkNode(s['ORPHANS'], {
      _id: 'ORPHANS',
      _children: ['TEST'],
      _parent: 'ROOT'
    });


    done();
  });

  it('# Checking UP chain for NODE.1', function(done) {
    checkArray(tree1.getUp('NODE.1'), ['NODE.1', 'ROOT']);
    done();
  });

  it('# Checking DOWN chain for NODE.1', function(done) {
    checkArray(tree1.getDown('NODE.1'), ['NODE.1', 'NODE.1.1', 'NODE.1.2']);
    done();
  });

  it('# Checking adding an element to NODE.1.1', function(done) {
    tree1.addNode({
      _id: 'NODE.1.1.1',
      _parent: 'NODE.1.1'
    });
    var s = tree1.getAllCopy();

    s.should.have.property('NODE.1.1.1');

    checkNode(s['NODE.1.1'], {
      _children: ['NODE.1.1.1'],
    });

    checkArray(tree1.getDown('NODE.1'), ['NODE.1', 'NODE.1.1', 'NODE.1.1.1', 'NODE.1.2']);

    done();
  });

  it('# Removing NODE.2 connecting children to NODE.1', function(done) {
    tree1.removeNode('NODE.2', 'NODE.1');
    var s = tree1.getAllCopy();

    (!s['NODE.2']).should.equal(true);

    checkNode(s['NODE.1'], {
      _children: ['NODE.1.1', 'NODE.1.2', 'NODE.2.1', 'NODE.2.2']
    });

    checkNode(s['NODE.2.1'], {
      _parent: 'NODE.1'
    });

    checkNode(s['NODE.2.2'], {
      _parent: 'NODE.1'
    });

    checkArray(tree1.getUp('NODE.2.1'), ['NODE.2.1', 'NODE.1', 'ROOT']);


    done();
  });

  it('# Removing NODE.1 connecting children orphan node', function(done) {
    tree1.removeNode('NODE.1');
    var s = tree1.getAllCopy();

    (!s['NODE.1']).should.equal(true);

    checkNode(s['MY_ORPHANS'], {
      _children: ['NODE.1.1', 'NODE.1.2', 'NODE.2.1', 'NODE.2.2', 'NODE.3']
    });

    checkNode(s['NODE.1.1'], {
      _parent: 'MY_ORPHANS'
    });

    checkNode(s['NODE.2.1'], {
      _parent: 'MY_ORPHANS'
    });

    done();
  });

  it('# Getting NODE.1.1 (by COPY)', function(done) {
    var nodeA = tree1.getNodeCopy('NODE.1.1');
    nodeA.value = '1000';
    var nodeB = tree1.getNodeCopy('NODE.1.1');

    checkNode(nodeA, {
      value: '1000'
    });
    checkNode(nodeB, {
      value: '3'
    });


    done();
  });

  it('# Updating NODE.1.1 (passing a COPY)', function(done) {
    var nodeA = tree1.getNodeCopy('NODE.1.1');
    nodeA.value = '1000';

    tree1.updateNode(nodeA);

    var nodeB = tree1.getNodeCopy('NODE.1.1');

    checkNode(nodeA, {
      value: '1000'
    });
    checkNode(nodeB, {
      value: '1000'
    });

    nodeA.value = '1';
    var nodeC = tree1.getNodeCopy('NODE.1.1');
    checkNode(nodeC, {
      value: '1000'
    });

    done();
  });

  it('# Exception, addNode without _id', function(done) {

    (function() {
      tree1.addNode({
        a: 1
      });
    }).should.throw(/Missing _id/);
    done();
  });

  it('# Exception, addNode without _parent === _id', function(done) {

    (function() {
      tree1.addNode({
        _id: "123",
        _parent: "123"
      });
    }).should.throw(/Node _id can not be equal to _parent/);
    done();
  });

  it('# Exception, addNode with _children', function(done) {

    (function() {
      tree1.addNode({
        _id: "123",
        _children: ['123']
      });
    }).should.throw(/_children field is not allowed./);
    done();
  });

  it('# Exception, removeNode without _id', function(done) {

    (function() {
      tree1.removeNode();
    }).should.throw(/Missing nodeId/);
    done();
  });

  it('# Exception, removeNode with wrong _id', function(done) {

    (function() {
      tree1.removeNode('NO_ID');
    }).should.throw(/not found/);
    done();
  });

  it('# Exception, removeNode with wrong orphan', function(done) {

    tree1.addNode({
      _id: 'CHILD',
      _parent: 'NODE.1.1.1'
    });

    (function() {
      tree1.removeNode('NODE.1.1.1', 'NO_ID');
    }).should.throw(/newParentForChildren node not found!/);

    done();
  });

  it('# Exception, removeNode ROOT or orphanParent is not allowed', function(done) {

    (function() {
      tree1.removeNode('ROOT');
    }).should.throw(/Not allowed to remove ROOT node/);

    (function() {
      tree1.removeNode('MY_ORPHANS');
    }).should.throw(/Not allowed to remove orphanParent node/);

    done();
  });

  it('# Exception, getNodeCopy without nodeId', function(done) {

    (function() {
      tree1.getNodeCopy();
    }).should.throw(/Missing nodeId/);

    done();
  });

  it('# Exception, getNodeCopy with wrong nodeId', function(done) {

    (function() {
      tree1.getNodeCopy('WRONG_ID');
    }).should.throw(/not found!/);

    done();
  });

  it('# Exception, updateNode with no nodeObject', function(done) {

    (function() {
      tree1.updateNode({});
    }).should.throw(/Missing nodeObject/);

    done();
  });

  it('# Exception, updateNode if nodeObject is not object', function(done) {

    (function() {
      tree1.updateNode("NOT AN OBJECT");
    }).should.throw(/Missing nodeObject/);

    done();
  });

  it('# Exception, updateNode if nodeObject has not _id', function(done) {

    (function() {
      tree1.updateNode({});
    }).should.throw(/Missing nodeObject._id/);

    done();
  });

  it('# Exception, updateNode if nodeObject has wrong _id', function(done) {

    (function() {
      tree1.updateNode({
        _id: "WRONG_ID"
      });
    }).should.throw(/not found, I can not update!/);

    done();
  });

});


function checkArray(array, expected) {
  array.should.be.an.Array;
  expected.should.be.an.Array;
  (array.length).should.be.equal(expected.length);
  for (var i = 0; i < array.length; i++) {
    array[i].should.be.equal(expected[i]);
  }
}

function checkNode(node, data) {
  if (data._id)
    node.should.have.property('_id', data._id);
  if (data._parent)
    node.should.have.property('_parent', data._parent);
  if (data._children)
    node.should.have.property('_children', data._children);
  if (data.value)
    node.should.have.property('value', data.value);
  if (data.noChildren)
    node.should.not.have.property('_children');
  if (data.noParent)
    node.should.not.have.property('_parent');
}