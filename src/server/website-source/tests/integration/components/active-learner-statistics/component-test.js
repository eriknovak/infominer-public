import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('active-learner-statistics', 'Integration | Component | active learner statistics', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{active-learner-statistics}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#active-learner-statistics}}
      template block text
    {{/active-learner-statistics}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
