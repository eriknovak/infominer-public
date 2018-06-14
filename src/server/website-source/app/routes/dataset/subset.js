import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import $ from 'jquery';

export default Route.extend({

    unloadExtra: service('unload-extra'),

    model(params) {
        // set a on scroll listener
        $(window).on('scroll', function () {
            // change display if the user scrolled down enough
            let display = $(document).scrollTop() > 500  ? 'block' : 'none';
            $('#go-to-top').css('display', display);
        });
        // get the subset info
        return this.get('store').peekRecord('subset', params.subset_id);
    },

    actions: {

        /**
         * Submits the changes to the subset information.
         */
        editSubset() {
            // get subset label and description
            let label = $('#edit-subset-modal input').val();
            let description = $('#edit-subset-modal textarea').val();

            // get warning and clean container
            let warningContent = $('#edit-subset-modal div.warning');
            warningContent.empty();

            if (label.length === 0) {
                // TODO: handle data omitence
                warningContent.append('<p class="warning-content">Subset label must be given!</p>');
            } else {
                $('#edit-subset-modal').modal('toggle');
                // get the current subset
                let subset = this.modelFor(this.routeName);

                // set the subset information
                subset.set('label', label);
                subset.set('description', description);

                // save the subset for persistance
                subset.save();
            }
        },

        /**
         * Removes the warning message within the subset creation model
         */
        removeModalWarnings() {
            // get warning container
            let warningContent = $('#edit-subset-modal div.warning');
            // empty warning container
            warningContent.empty();
        },

        deleteSubset() {
            let self = this;
            let subset = self.modelFor(self.routeName);
            $('#delete-subset-modal .modal-footer .btn-danger').html(
                '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>'
            );
            // this subset is the root subset - cannot delete it
            self.modelFor('dataset').get('hasSubsets').removeObject(subset);
            subset.destroyRecord().then(() => {
                // reload dataset model
                self.modelFor('dataset').reload().then((response) => {
                    self.get('unloadExtra.unload')(response, self.get('store'), 'method');
                    self.get('unloadExtra.unload')(response, self.get('store'), 'subset');
                    self.modelFor('dataset').reload().then(() => {
                        $('#edit-subset-modal').modal('toggle');
                        $('#delete-subset-modal').modal('toggle');
                        $('#delete-subset-modal .modal-footer .btn-danger').html('Yes, delete subset');
                        let datasetId = parseInt(self.modelFor('dataset').get('id'));
                        self.transitionTo('dataset.subset', datasetId, 0);
                    })
                });
            });
        },

        /**
         * Moves the window to the top of the page, smoothly.
         */
        backToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

});
