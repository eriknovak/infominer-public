import { test } from 'qunit';
import moduleForAcceptance from 'infominer-website/tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | info miner');

test('should show datasets as homepage', function (assert) {
  visit('/');
  andThen(function() {
    assert.equal(currentURL(), '/datasets', 'should redirect automatically');
  });
});

test('should link to datasets page', function (assert) {
  visit('/');
  click('a:contains("datasets")');
  andThen(function () {
    assert.equal(currentURL(), '/datasets', 'should navigate to datasets');
  });
});