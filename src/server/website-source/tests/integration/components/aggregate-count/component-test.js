import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('aggregate-count', 'Integration | Component | aggregate count', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{aggregate-count}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#aggregate-count}}
      template block text
    {{/aggregate-count}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
