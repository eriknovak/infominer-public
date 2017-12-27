import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('create-subset-modal-from-method', 'Integration | Component | create subset modal from method', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{create-subset-modal-from-method}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#create-subset-modal-from-method}}
      template block text
    {{/create-subset-modal-from-method}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
