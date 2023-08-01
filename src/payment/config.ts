interface Config {
    name: string,
    
    // Functionality
    get_terminals: () => any[],

}

const configurations: Config[] = []

export default configurations
export type { Config }