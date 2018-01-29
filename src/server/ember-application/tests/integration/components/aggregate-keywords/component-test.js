import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('aggregate-keywords', 'Integration | Component | aggregate keywords', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{aggregate-keywords}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#aggregate-keywords}}
      template block text
    {{/aggregate-keywords}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
