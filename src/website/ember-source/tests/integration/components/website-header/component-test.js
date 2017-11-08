import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('website-header', 'Integration | Component | website header', {
  integration: true
});

test('should display website header', function (assert) {
  this.render(hbs`{{website-header}}`);
  assert.equal(this.$('.navbar-brand').text(), 'InfoMiner', 'Brand: InfoMiner');
});