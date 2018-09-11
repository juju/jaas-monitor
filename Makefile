.DEFAULT_GOAL := setup

PROJECT=jaas-monitor
NODE_MODULES = node_modules


$(NODE_MODULES):
	npm install

.PHONY: build
build: setup
	rm -rf dist .cache
	npm run-script build

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
	@echo 'make run - run parcel development server'
	@echo 'make build - build parcel package'

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
	rm -rf dist .cache
	npm start

.PHONY: setup
setup: $(NODE_MODULES)

.PHONY: test
test: setup
	npm t
