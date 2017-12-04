import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize(serialized) {
    return Object.keys(serialized).length == 0 ? null : serialized;
  },

  serialize(deserialized) {
    return this.deserialize(deserialized);
  }

});
