# terraform-plan-comment-action

This GitHub action creates a comment with all changes from `terraform plan`.

## Usage

### Simple

```yaml
jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: hashicorp/setup-terraform@v1
      - run: terraform init
      - run: terraform plan
        id: plan
      - uses: terraform-plan-comment-action@master
        with:
          plan: ${{ steps.plan.outputs.stdout }}
```

### Monorepo

```yaml
jobs:
  modules:
    runs-on: ubuntu-latest
    steps:
      - uses: theappnest/terraform-monorepo-action@master
        id: modules
    outputs:
      modules: ${{ steps.modules.outputs.modules }}

  terraform:
    runs-on: ubuntu-latest
    needs: modules
    strategy:
      matrix:
        module: ${{ fromJson(needs.modules.outputs.modules) }}
    defaults:
      run:
        working-directory: ${{ matrix.module }}
    steps:
      - uses: actions/checkout@v2
      - uses: hashicorp/setup-terraform@v1
      - run: terraform init
      - run: terraform plan
        id: plan
      - run: |
          mkdir -p "$(dirname "${{ github.workspace }}/plan/${{ matrix.module }}")"
          cat <<- EOF > ${{ github.workspace }}/plan/${{ matrix.module }}
          ${{ steps.plan.outputs.stdout }}
          EOF
      - uses: actions/upload-artifact@v2
        with:
          name: terraform-plan
          path: ${{ github.workspace }}/plan/**
          retention-days: 1

  comment:
    runs-on: ubuntu-latest
    needs: terraform
    defaults:
      run:
        working-directory: plan
    steps:
      - uses: actions/download-artifact@v2
        with:
          name: terraform-plan
      - uses: theappnest/terraform-plan-comment-action@adam/create-action
        with:
          path: '**'
```

## Inputs

> NOTE: Either `plan` or `path` is required.

- `token` (optional) GitHub token. Defaults to secrets.GITHUB_TOKEN.
- `path` (optional) A path glob to check for `terraform plan` output files.
- `plan` (optional) The output of `terraform plan`.
