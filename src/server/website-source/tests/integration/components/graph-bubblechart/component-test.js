import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('graph-piechart', 'Integration | Component | graph piechart', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{graph-piechart}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#graph-piechart}}
      template block text
    {{/graph-piechart}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
