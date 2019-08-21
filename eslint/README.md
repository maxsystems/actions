# eslint

This action runs ESLint in the environment. Warnings and errors will be annotated in the GitHub diff viewer.

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: maxsystems/actions/eslint@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    extensions: '.js,.vue' # Customize the extensions to lint
```
