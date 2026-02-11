export default `
> [!question] {{question}}
> <span class="q-meta"> 
{{#each attributes}}
> <span key="{{key}}" value="{{val}}" class="badge {{cssClass}}">{{label}}</span>
{{/each}}
> </span> 
> 
> > [!answer]- Answer 
{{{answer}}}
`;
