export class MultiLoader {
  constructor({documentLoader} = {}) {
    this.loaders = [];
    if(documentLoader) {
      this.loaders = this.loaders.concat(documentLoader);
    }
  }

  addLoader(loader) {
    this.loaders.push(loader);
  }

  async documentLoader(url) {
    let result;
    for(const loader of this.loaders) {
      try {
        result = await loader(url);
      } catch(e) {
        // this loader failed move on to the next
        continue;
      }
      if(result) {
        return result;
      }
    }
    // failure, throw
    throw new Error(`Document not found: ${url}`);
  }

} // end MultiLoader
