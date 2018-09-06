.DEFAULT_GOAL := setup

PROJECT=jaas-monitor
NODE_MODULES = node_modules

PARCEL = node_modules/.bin/parcel
WEBAPP = examples/browser/index.html


$(NODE_MODULES):
	npm install

.PHONY: build
build: setup
	$(PARCEL) build $(WEBAPP)

.PHONY: check
check: lint test

.PHONY: clean
clean:
	rm -rf $(NODE_MODULES)/ dist .cache
	rm -f package-lock.json

.PHONY: help
help:
	@echo -e '$(PROJECT) - list of make targets:\n'
	@echo 'make test - run tests'
	@echo 'make lint - run linter'
	@echo 'make check - run both linter and tests'
	@echo 'make clean - get rid of development and build artifacts'
	@echo 'make release - publish a release on npm'

.PHONY: lint
lint: setup
	npm run lint

.PHONY: release
release: clean check
	$(eval current := $(shell npm view $(PROJECT) version))
	$(eval package := $(shell npm version | grep $(PROJECT) | cut -d "'" -f 2))
	@test $(current) != $(package) || ( \
		echo cannot publish existing version $(current): update package.json; \
		exit 1 \
	)
	git tag $(package)
	git push --tags
	npm publish

.PHONY: run
run: setup
	$(PARCEL) $(WEBAPP)

.PHONY: setup
setup: $(NODE_MODULES)


.PHONY: test
test: setup
	npm t
