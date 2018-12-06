import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('active-learner-actions', 'Integration | Component | active learner actions', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{active-learner-actions}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#active-learner-actions}}
      template block text
    {{/active-learner-actions}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
