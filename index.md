{% assign pages = site.html_pages | where_exp:'page','page.sitemap != false' | where_exp:'page','page.url != "/"' | sort:'last_modified_at' %}
<ul>
{% for page in pages reversed %}
    {% assign date = page.last_modified_at | date:'%-d. %-m. %Y' %}
    <li><a href="{{ page.url | relative_url }}" title="{{ page.title }} -  {{ date }}">{{ page.title }}</a> [{{ date }}]</li>
{% endfor %}
</ul>
