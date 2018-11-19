import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('active-learner-selector', 'Integration | Component | active learner selector', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{active-learner-selector}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#active-learner-selector}}
      template block text
    {{/active-learner-selector}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
