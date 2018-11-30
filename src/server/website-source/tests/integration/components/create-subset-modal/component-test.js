import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('subset-create-modal', 'Integration | Component | subset create modal', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{subset-create-modal}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#subset-create-modal}}
      template block text
    {{/subset-create-modal}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
