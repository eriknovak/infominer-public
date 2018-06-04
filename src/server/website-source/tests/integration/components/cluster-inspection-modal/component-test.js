import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('cluster-inspection-modal', 'Integration | Component | cluster inspection modal', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{cluster-inspection-modal}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#cluster-inspection-modal}}
      template block text
    {{/cluster-inspection-modal}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
