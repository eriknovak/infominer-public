import Route from '@ember/routing/route';
import { task } from 'ember-concurrency';

const { get, set } = Ember;

export default Route.extend({

    uploadDataset: task(function * (file) {
        console.log(get(file, 'name'));
        let product = this.modelFor('product');
        console.log("Second");
        file.readAsText().then(function (data) {
            console.log(data);
            Ember.$('#file-content').text(data);
        });

        let dataset = this.store.createRecord('dataset', {
          product,
          filename: get(file, 'name'),
          filesize: get(file, 'size')
        });

        try {
        console.log("Third");

          file.readAsDataURL().then(function (url) {
            if (get(dataset, 'url') == null) {
              set(dataset, 'url', url);
            }
          });

        console.log("Fourth");

          let response = yield file.upload('/api/dataset/upload');
          this.set(dataset, 'url', response.headers.Location);
          yield dataset.save();
          this.transitionTo(`/dataset/${get(dataset, 'id')}`);
        } catch (e) {
            dataset.rollback();
        }
      }).maxConcurrency(3).enqueue(),

      actions: {
        uploadData(file) {
          console.log(file);
          this.get('uploadDataset').perform(file);
        }
      }
});
