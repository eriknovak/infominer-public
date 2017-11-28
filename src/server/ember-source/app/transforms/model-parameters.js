import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize(serialized) {
    return Object.keys(serialized).length == 0 ? { } : serialized;
  },

  serialize(deserialized) {
    return Object.keys(deserialized).length == 0 ? { } : deserialized;
  }
});
